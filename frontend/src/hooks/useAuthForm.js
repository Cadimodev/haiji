import { useState, useEffect, useRef } from "react";

export function useAuthForm(initialValues, validate) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [backendError, setBackendError] = useState("");

    // Ref for knowing if user has edited the form
    const isDirty = useRef(false);

    useEffect(() => {
        if (!isDirty.current && JSON.stringify(values) !== JSON.stringify(initialValues)) {
            setValues(initialValues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialValues]);

    const handleChange = (e) => {
        if (!isDirty.current) {
            isDirty.current = true;
        }

        setValues({
            ...values,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e, submitCallback) => {
        e.preventDefault();

        const validationErrors = validate(values);
        setErrors(validationErrors);
        setBackendError("");

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        await submitCallback();
    };

    return {
        values,
        errors,
        backendError,
        handleChange,
        handleSubmit,
        setBackendError,
    };
}
