"use client";

import { SnackbarProvider } from "notistack";
import { ReactNode } from "react";

interface SnackbarClientProps {
    children: ReactNode;
}

export default function SnackbarClient({ children }: SnackbarClientProps) {
    return (
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
            {children}
        </SnackbarProvider>
    );
}
