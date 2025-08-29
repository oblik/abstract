import { 
  regValidate, 
  regInputValidate, 
  otpValidate, 
  otpInputValidate, 
  withdrawValidate, 
  withdrawInputValidate 
} from '@/app/validation/validation';

// Mock is-empty import
jest.mock('is-empty', () => ({
  __esModule: true,
  default: jest.fn((value) => {
    if (value === '' || value === null || value === undefined) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  })
}));

// Mock isAddress
jest.mock('@/app/helper/custommath', () => ({
  isAddress: jest.fn((address) => {
    return address && address.length > 30 && address.length < 50;
  })
}));

import isEmpty from 'is-empty';
import { isAddress } from '@/app/helper/custommath';

describe('regValidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return email required error for empty email', async () => {
    const params = { email: '' };
    const result = await regValidate(params);
    
    expect(result).toEqual({ email: 'Email is required' });
  });

  test('should return email invalid error for invalid email format', async () => {
    const params = { email: 'invalid-email' };
    const result = await regValidate(params);
    
    expect(result).toEqual({ email: 'Email is invalid' });
  });

  test('should return no errors for valid email', async () => {
    const params = { email: 'test@example.com' };
    const result = await regValidate(params);
    
    expect(result).toEqual({});
  });

  test('should handle valid email formats', async () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'test123@test-domain.com',
      'a@b.co'
    ];

    for (const email of validEmails) {
      const params = { email };
      const result = await regValidate(params);
      expect(result).toEqual({});
    }
  });

  test('should handle invalid email formats', async () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test.com',
      'test@.com',
      'test..test@example.com'
    ];

    for (const email of invalidEmails) {
      const params = { email };
      const result = await regValidate(params);
      expect(result).toEqual({ email: 'Email is invalid' });
    }
  });
});

describe('regInputValidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return email required error for empty email when name is email', () => {
    const params = { email: '' };
    const result = regInputValidate(params, 'email');
    
    expect(result).toEqual({ email: 'Email is required' });
  });

  test('should return email invalid error for invalid email when name is email', () => {
    const params = { email: 'invalid-email' };
    const result = regInputValidate(params, 'email');
    
    expect(result).toEqual({ email: 'Email is invalid' });
  });

  test('should return no errors when name is not email', () => {
    const params = { email: 'invalid-email' };
    const result = regInputValidate(params, 'password');
    
    expect(result).toEqual({});
  });

  test('should return no errors for valid email when name is email', () => {
    const params = { email: 'test@example.com' };
    const result = regInputValidate(params, 'email');
    
    expect(result).toEqual({});
  });
});

describe('otpValidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return OTP required error for empty OTP', async () => {
    const params = { otp: '' };
    const result = await otpValidate(params);
    
    expect(result).toEqual({ otp: 'OTP is required' });
  });

  test('should return invalid OTP error for non-numeric OTP', async () => {
    const params = { otp: 'abc123' };
    const result = await otpValidate(params);
    
    expect(result).toEqual({ otp: 'invalid OTP' });
  });

  test('should return no errors for valid numeric OTP', async () => {
    const params = { otp: '123456' };
    const result = await otpValidate(params);
    
    expect(result).toEqual({});
  });

  test('should handle numeric OTP as string', async () => {
    const params = { otp: '123456' };
    const result = await otpValidate(params);
    
    expect(result).toEqual({});
  });

  test('should handle numeric OTP as number', async () => {
    const params = { otp: 123456 };
    const result = await otpValidate(params);
    
    expect(result).toEqual({});
  });
});

describe('otpInputValidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return OTP required error for empty OTP when name is otp', () => {
    const params = { otp: '' };
    const result = otpInputValidate(params, 'otp');
    
    expect(result).toEqual({ otp: 'OTP is required' });
  });

  test('should return invalid OTP error for non-numeric OTP when name is otp', () => {
    const params = { otp: 'abc123' };
    const result = otpInputValidate(params, 'otp');
    
    expect(result).toEqual({ otp: 'invalid OTP' });
  });

  test('should return no errors when name is not otp', () => {
    const params = { otp: 'abc123' };
    const result = otpInputValidate(params, 'password');
    
    expect(result).toEqual({});
  });

  test('should return no errors for valid OTP when name is otp', () => {
    const params = { otp: '123456' };
    const result = otpInputValidate(params, 'otp');
    
    expect(result).toEqual({});
  });
});

describe('withdrawValidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return address required error for empty address', async () => {
    const params = { userAddress: '', amount: '100' };
    const result = await withdrawValidate(params);
    
    expect(result).toEqual({ userAddress: 'Address is required' });
  });

  test('should return invalid address error for invalid address', async () => {
    (isAddress as jest.Mock).mockReturnValueOnce(false);
    
    const params = { userAddress: 'invalid_address', amount: '100' };
    const result = await withdrawValidate(params);
    
    expect(result).toEqual({ userAddress: 'Invalid Address' });
  });

  test('should return amount required error for empty amount', async () => {
    const params = { userAddress: 'valid_address', amount: '' };
    const result = await withdrawValidate(params);
    
    expect(result).toEqual({ amount: 'Amount is required' });
  });

  test('should return invalid amount error for non-numeric amount', async () => {
    const params = { userAddress: 'valid_address', amount: 'invalid' };
    const result = await withdrawValidate(params);
    
    expect(result).toEqual({ amount: 'Invalid amount' });
  });

  test('should return multiple errors when both address and amount are invalid', async () => {
    (isAddress as jest.Mock).mockReturnValueOnce(false);
    
    const params = { userAddress: 'invalid_address', amount: 'invalid' };
    const result = await withdrawValidate(params);
    
    expect(result).toEqual({
      userAddress: 'Invalid Address',
      amount: 'Invalid amount'
    });
  });

  test('should return no errors for valid address and amount', async () => {
    (isAddress as jest.Mock).mockReturnValueOnce(true);
    
    const params = { userAddress: 'valid_address', amount: '100' };
    const result = await withdrawValidate(params);
    
    expect(result).toEqual({});
  });

  test('should handle valid numeric amounts', async () => {
    (isAddress as jest.Mock).mockReturnValueOnce(true);
    
    const validAmounts = ['100', '100.50', '0.001', '1000000'];
    
    for (const amount of validAmounts) {
      const params = { userAddress: 'valid_address', amount };
      const result = await withdrawValidate(params);
      expect(result).toEqual({});
    }
  });
});

describe('withdrawInputValidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return address required error for empty address when name is userAddress', () => {
    const params = { userAddress: '', amount: '100' };
    const result = withdrawInputValidate(params, 'userAddress');
    
    expect(result).toEqual({ userAddress: 'Address is required' });
  });

  test('should return invalid address error for invalid address when name is userAddress', () => {
    (isAddress as jest.Mock).mockReturnValueOnce(false);
    
    const params = { userAddress: 'invalid_address', amount: '100' };
    const result = withdrawInputValidate(params, 'userAddress');
    
    expect(result).toEqual({ userAddress: 'Invalid Address' });
  });

  test('should return amount required error for empty amount when name is amount', () => {
    const params = { userAddress: 'valid_address', amount: '' };
    const result = withdrawInputValidate(params, 'amount');
    
    expect(result).toEqual({ amount: 'Amount is required' });
  });

  test('should return invalid amount error for non-numeric amount when name is amount', () => {
    const params = { userAddress: 'valid_address', amount: 'invalid' };
    const result = withdrawInputValidate(params, 'amount');
    
    expect(result).toEqual({ amount: 'Invalid amount' });
  });

  test('should return no errors when name is not userAddress or amount', () => {
    const params = { userAddress: '', amount: 'invalid' };
    const result = withdrawInputValidate(params, 'other');
    
    expect(result).toEqual({});
  });

  test('should return no errors for valid inputs when name matches', () => {
    (isAddress as jest.Mock).mockReturnValueOnce(true);
    
    const params = { userAddress: 'valid_address', amount: '100' };
    const result1 = withdrawInputValidate(params, 'userAddress');
    const result2 = withdrawInputValidate(params, 'amount');
    
    expect(result1).toEqual({});
    expect(result2).toEqual({});
  });
});