import { useState } from "react";

export function useAuthForm(initialValues, validate) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [backendError, setBackendError] = useState("");

    const handleChange = (e) => {
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
