"use client";
import { useSnackbar } from "notistack";

type VariantType = 'default' | 'error' | 'success' | 'warning' | 'info';

export function useToast() {
    const { enqueueSnackbar } = useSnackbar();

    return (errorType: VariantType, message: string) => {
        enqueueSnackbar(message, {
            variant: errorType,
            autoHideDuration: 2500,
            anchorOrigin: { horizontal: "right", vertical: "top" },
            preventDuplicate: true,
        });
    };
}