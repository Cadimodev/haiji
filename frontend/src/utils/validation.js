export function validateLogin(values) {
    const errors = {};
    if (!values.username) {
        errors.username = "Username is required";
    }
    if (!values.password) {
        errors.password = "Password is required";
    }
    else if (values.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
    }
    return errors;
}

export function validateRegister(values) {
    const errors = {};
    if (!values.email) {
        errors.email = "Email is required";
    }
    else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = "Email is invalid";
    }

    if (!values.username) {
        errors.username = "Username is required";
    }
    else if (/\s/.test(values.username)) {
        errors.username = "Username must not contain spaces";
    }

    if (!values.password) {
        errors.password = "Password is required";
    }
    else if (values.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
    }

    return errors;
}
