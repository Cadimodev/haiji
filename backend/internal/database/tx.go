package database

import (
	"context"
	"database/sql"
	"fmt"
)

// TxManager handles database transactions
type TxManager interface {
	ExecTx(ctx context.Context, fn func(Querier) error) error
}

type SqlTxManager struct {
	db *sql.DB
}

func NewSqlTxManager(db *sql.DB) *SqlTxManager {
	return &SqlTxManager{db: db}
}

func (tm *SqlTxManager) ExecTx(ctx context.Context, fn func(Querier) error) error {
	tx, err := tm.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	q := New(tx)
	err = fn(q)
	if err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("tx err: %v, rb err: %v", err, rbErr)
		}
		return err
	}

	return tx.Commit()
}
