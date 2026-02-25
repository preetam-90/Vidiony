"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Dynamically import StackProvider with SSR disabled
const StackProviderWithNoSSR = dynamic(
    () => import("./stack-provider-inner").then((mod) => mod.StackProviderInner),
    {
        ssr: false,
        loading: () => null
    }
);

interface StackProviderWrapperProps {
    children: ReactNode;
}

export function StackProviderWrapper({ children }: StackProviderWrapperProps) {
    return (
        <>
            <StackProviderWithNoSSR>{children}</StackProviderWithNoSSR>
            <noscript>{children}</noscript>
        </>
    );
}
