import { UpdateUserDto } from '../../../src/users/dto/update-user.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer'; 

describe('UpdateUserDto', () => {
  it('should validate a valid update user DTO with all fields', async () => {
    const dto = plainToInstance(UpdateUserDto, { 
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      password: 'NewPass456',
      phone: '(21) 99876-5432',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid update user DTO with only name', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      name: 'Jane Doe Updated'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid update user DTO with only email', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      email: 'new.email@example.com'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if email is invalid', async () => {
    const dto = plainToInstance(UpdateUserDto, { 
      email: 'invalid-email'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('email');
  });

  it('should transform empty email string to null', async () => {
    const dto = plainToInstance(UpdateUserDto, { 
      email: '' 
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.email).toBeNull();
  });

  it('should fail validation if password is too short', async () => {
    const dto = plainToInstance(UpdateUserDto, { 
      password: 'short'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('password');
  });

  it('should fail validation if password does not contain letters and numbers', async () => {
    const dto = plainToInstance(UpdateUserDto, { 
      password: '123456789'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('password');
  });

  it('should fail validation if phone is invalid', async () => {
    const dto = plainToInstance(UpdateUserDto, { 
      phone: '123'
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('phone');
  });

  it('should allow file to be optional', async () => {
    const dto = plainToInstance(UpdateUserDto, { 
      name: 'Test User',
      file: undefined,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});