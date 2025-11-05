import React, { useEffect } from "react";

function HomePage() {
    useEffect(() => {
        console.log("HomePage mounted");
        return () => console.log("HomePage unmounted");
    }, []);

    return (
        <div>
            <h1>Welcome to Haiji</h1>
        </div>
    );
}

export default HomePage;
