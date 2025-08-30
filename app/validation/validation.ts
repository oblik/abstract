import isEmpty from "is-empty";
import { isAddress } from "../helper/custommath"

interface ValidationErrors {
  [key: string]: string;
}

interface RegParams {
  email: string;
}

interface OtpParams {
  otp: string;
}

interface WithdrawParams {
  userAddress: string;
  amount: string;
}

export const regValidate = async (params: RegParams): Promise<ValidationErrors> => {
    let errors: ValidationErrors = {}
    let emailRegex = /^[a-zA-Z][a-zA-Z0-9._-]*[a-zA-Z0-9]@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/

    if (isEmpty(params.email)) {
        errors.email = "Email is required";
    } else if (!emailRegex.test(params.email)) {
        errors.email = "Email is invalid";
    } 

    return errors;
}

export const regInputValidate = (params: RegParams, name: string): ValidationErrors => {
    let errors: ValidationErrors = {}
    let emailRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/;

    if (isEmpty(params.email) && name === "email") {
        errors.email = "Email is required";
    } else if (!emailRegex.test(params.email) && name === "email") {
        errors.email = "Email is invalid";
    }
  
    return errors;
}


export const otpValidate = async (params: OtpParams): Promise<ValidationErrors> => {
    let errors: ValidationErrors = {}

    if (isEmpty(params.otp)) {
        errors.otp = "OTP is required";
    } else if (isNaN(Number(params.otp))) {
        errors.otp = "invalid OTP";
    }

    return errors;
}

export const otpInputValidate = (params: OtpParams, name: string): ValidationErrors => {
    let errors: ValidationErrors = {}

    if (isEmpty(params.otp) && name === 'otp') {
        errors.otp = "OTP is required";
    } else if (isNaN(Number(params.otp)) && name === 'otp') {
        errors.otp = "invalid OTP";
    }

    return errors;
}


export const withdrawValidate = async (params: WithdrawParams): Promise<ValidationErrors> => {
    let errors: ValidationErrors = {}

    if (isEmpty(params.userAddress)) {
        errors.userAddress = "Address is required";
    }else if(!isAddress(params.userAddress)){
        errors.userAddress = "Invalid Address";
    }

    if (isEmpty(params.amount)) {
        errors.amount = "Amount is required";
    } else if (isNaN(Number(params.amount))) {
        errors.amount = "Invalid amount";
    }


    return errors;
}

export const withdrawInputValidate = (params: WithdrawParams, name: string): ValidationErrors => {
    let errors: ValidationErrors = {}

    if (isEmpty(params.userAddress) && name === 'userAddress') {
        errors.userAddress = "Address is required";
    } else if(!isAddress(params.userAddress) && name === 'userAddress' ){
        errors.userAddress = "Invalid Address";
    }

    if (isEmpty(params.amount) && name === 'amount') {
        errors.amount = "Amount is required";
    } else if (isNaN(Number(params.amount)) && name === 'amount') {
        errors.amount = "Invalid amount";
    }


    return errors;
}