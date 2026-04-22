import React from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow max-w-md mx-auto p-4">{children}</main>
            <BottomNav />
        </div>
    );
};

export default Layout;