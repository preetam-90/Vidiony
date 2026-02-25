"use client";

import { StackProvider, StackTheme, StackClientApp } from "@stackframe/stack";
import { ReactNode } from "react";

// Create a client-side Stack app
const stackClientApp = new StackClientApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
    tokenStore: 'memory',
});

interface StackProviderInnerProps {
    children: ReactNode;
}

export function StackProviderInner({ children }: StackProviderInnerProps) {
    return (
        <StackProvider app={stackClientApp}>
            <StackTheme>{children}</StackTheme>
        </StackProvider>
    );
}