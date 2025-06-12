import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class User extends Document {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca' })
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @ApiProperty({ example: 'example@example.com' })
  @Prop({ unique: true })
  email: string;

  @ApiProperty({ example: 'password123' })
  @Prop()
  password: string;

  @ApiProperty({ example: 'someRefreshToken', required: false })
  @Prop({ default: 'xx' })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
