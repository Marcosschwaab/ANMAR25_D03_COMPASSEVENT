import { CreateUserDto } from '../../../src/users/dto/create-user.dto';
import { validate } from 'class-validator';
import { UserRole } from '../../../src/users/entities/user.entity';

describe('CreateUserDto', () => {
  it('should validate a valid create user DTO', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john.doe@example.com';
    dto.password = 'Password123';
    dto.phone = '(11) 98765-4321';
    dto.role = UserRole.PARTICIPANT;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if name is empty', async () => {
    const dto = new CreateUserDto();
    dto.name = '';
    dto.email = 'john.doe@example.com';
    dto.password = 'Password123';
    dto.phone = '(11) 98765-4321';
    dto.role = UserRole.PARTICIPANT;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('name');
  });

  it('should fail validation if email is invalid', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'invalid-email';
    dto.password = 'Password123';
    dto.phone = '(11) 98765-4321';
    dto.role = UserRole.PARTICIPANT;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('email');
  });

  it('should fail validation if password is too short', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john.doe@example.com';
    dto.password = 'short';
    dto.phone = '(11) 98765-4321';
    dto.role = UserRole.PARTICIPANT;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('password');
  });

  it('should fail validation if password does not contain letters and numbers', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john.doe@example.com';
    dto.password = 'onlyletters';
    dto.phone = '(11) 98765-4321';
    dto.role = UserRole.PARTICIPANT;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('password');
  });

  it('should fail validation if phone is invalid', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john.doe@example.com';
    dto.password = 'Password123';
    dto.phone = '123';
    dto.role = UserRole.PARTICIPANT;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('phone');
  });

  it('should fail validation if role is invalid', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john.doe@example.com';
    dto.password = 'Password123';
    dto.phone = '(11) 98765-4321';
    dto.role = 'invalid-role' as UserRole;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('role');
  });

  it('should allow file to be optional', async () => {
    const dto = new CreateUserDto();
    dto.name = 'John Doe';
    dto.email = 'john.doe@example.com';
    dto.password = 'Password123';
    dto.phone = '(11) 98765-4321';
    dto.role = UserRole.PARTICIPANT;
    dto.file = undefined;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});