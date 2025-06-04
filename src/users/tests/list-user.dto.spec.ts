import { ListUserDto } from '../../../src/users/dto/list-user.dto';
import { validate } from 'class-validator';
import { UserRole } from '../../../src/users/entities/user.entity';
import { plainToInstance } from 'class-transformer';

describe('ListUserDto', () => {
  it('should validate a valid list user DTO with all optional fields', async () => {
    const dto = plainToInstance(ListUserDto, {
      name: 'John',
      email: 'john@example.com',
      role: UserRole.PARTICIPANT,
      page: 2,
      limit: 5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid list user DTO with no fields', async () => {
    const dto = new ListUserDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation if role is invalid', async () => {
    const dto = plainToInstance(ListUserDto, {
      role: 'invalid-role',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('role');
  });

  it('should fail validation if page is not an integer', async () => {
    const dto = plainToInstance(ListUserDto, {
      page: 1.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('page');
  });

  it('should fail validation if page is less than 1', async () => {
    const dto = plainToInstance(ListUserDto, {
      page: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('page');
  });

  it('should fail validation if limit is not an integer', async () => {
    const dto = plainToInstance(ListUserDto, {
      limit: 10.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('limit');
  });

  it('should fail validation if limit is less than 1', async () => {
    const dto = plainToInstance(ListUserDto, {
      limit: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toEqual('limit');
  });

  it('should correctly transform page and limit to numbers', async () => {
    const dto = plainToInstance(ListUserDto, {
      page: '1',
      limit: '10',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(typeof dto.page).toBe('number');
    expect(typeof dto.limit).toBe('number');
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });
});