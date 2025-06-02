'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const TopAppBar: React.FC = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return (
        <mdui-top-app-bar className="flex px-2 items-center justify-between">
            <mdui-button variant="tonal" className="relative py-2 w-34 h-12">
                <Image src="/full-logo.svg" alt="logo" fill className="object-contain" />
            </mdui-button>
        </mdui-top-app-bar>
    );
}

export default dynamic(() => Promise.resolve(TopAppBar), { ssr: false });