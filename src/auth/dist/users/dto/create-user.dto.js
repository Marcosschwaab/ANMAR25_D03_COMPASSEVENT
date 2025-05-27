"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const user_entity_1 = require("../entities/user.entity");
const swagger_1 = require("@nestjs/swagger");
class CreateUserDto {
    name;
    email;
    password;
    phone;
    role;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'John Doe',
        description: 'The full name of the user',
        required: true
    }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'john.doe@example.com',
        description: 'The email address of the user',
        required: true
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Password123',
        description: 'The password (min 8 chars with letters and numbers)',
        minLength: 8,
        required: true
    }),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.Matches)(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
        message: 'Password must be at least 8 characters and include both letters and numbers',
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '+1234567890',
        description: 'The phone number of the user',
        required: true
    }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: user_entity_1.UserRole,
        example: user_entity_1.UserRole.PARTICIPANT,
        description: 'The role of the user',
        required: true
    }),
    (0, class_validator_1.IsEnum)(user_entity_1.UserRole),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
//# sourceMappingURL=create-user.dto.js.map