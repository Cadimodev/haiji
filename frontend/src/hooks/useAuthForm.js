import { useState, useEffect, useRef } from "react";

export function useAuthForm(initialValues, validate) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [backendError, setBackendError] = useState("");

    // Ref para saber si el usuario ha modificado el formulario
    const isDirty = useRef(false);

    useEffect(() => {
        if (!isDirty.current) {
            setValues(initialValues);
        }
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
