package database

import (
	"net"

	"github.com/sqlc-dev/pqtype"
)

func ToInet(ip net.IP) pqtype.Inet {
	if ip == nil {
		return pqtype.Inet{Valid: false}
	}
	if ip4 := ip.To4(); ip4 != nil {
		return pqtype.Inet{
			IPNet: net.IPNet{IP: ip4, Mask: net.CIDRMask(32, 32)},
			Valid: true,
		}
	}
	return pqtype.Inet{
		IPNet: net.IPNet{IP: ip, Mask: net.CIDRMask(128, 128)},
		Valid: true,
	}
}
