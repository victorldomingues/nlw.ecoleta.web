import React from 'react';

interface HaderProps {
    title: string;
}

const Header: React.FC<HaderProps> = (props) => {
    return (
        <header>
            <h1>{props.title}</h1>
        </header>
    );
}

export default Header;