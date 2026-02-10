"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const env_1 = __importDefault(require("../../shared/utils/env"));
const swaggerURL = env_1.default.get('NODE_ENV') === 'development'
    ? 'http://localhost:8081/api/v1'
    : 'https://testify-backend-kgtv.onrender.com/api/v1';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Testify API',
            version: '1.0.0',
            description: 'API documentation for Testify Backend Application',
            contact: {
                name: 'API Support',
                email: 'support@testify.com',
            },
        },
        servers: [
            {
                url: `${swaggerURL}`,
                description: 'Development server',
            },
            {
                url: `${swaggerURL}`,
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        error: {
                            type: 'object',
                            properties: {
                                code: {
                                    type: 'string',
                                    example: 'VALIDATION_ERROR',
                                },
                                message: {
                                    type: 'string',
                                    example: 'Validation failed',
                                },
                                details: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            field: {
                                                type: 'string',
                                                example: 'content',
                                            },
                                            message: {
                                                type: 'string',
                                                example: 'Content must be between 1 and 5000 characters',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: {
                            type: 'integer',
                            example: 1,
                        },
                        limit: {
                            type: 'integer',
                            example: 20,
                        },
                        total: {
                            type: 'integer',
                            example: 100,
                        },
                        totalPages: {
                            type: 'integer',
                            example: 5,
                        },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000',
                        },
                        username: {
                            type: 'string',
                            example: 'johndoe',
                        },
                        avatar: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://cdn.example.com/avatars/john.jpg',
                        },
                    },
                },
                MediaAttachment: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['image', 'video', 'audio'],
                            example: 'image',
                        },
                        url: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://cdn.example.com/images/photo.jpg',
                        },
                        thumbnail_url: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://cdn.example.com/thumbnails/photo.jpg',
                        },
                        duration: {
                            type: 'integer',
                            example: 180,
                        },
                        size: {
                            type: 'integer',
                            example: 2048000,
                        },
                        mime_type: {
                            type: 'string',
                            example: 'image/jpeg',
                        },
                        filename: {
                            type: 'string',
                            example: 'photo.jpg',
                        },
                        order_index: {
                            type: 'integer',
                            example: 0,
                        },
                    },
                },
                Post: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000',
                        },
                        user_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        content: {
                            type: 'string',
                            example: 'Hello world! This is my first post.',
                        },
                        post_type: {
                            type: 'string',
                            enum: ['text', 'image', 'video', 'audio', 'mixed'],
                            example: 'text',
                        },
                        visibility: {
                            type: 'string',
                            enum: ['public', 'followers_only', 'mentioned_only', 'private'],
                            example: 'public',
                        },
                        media_attachments: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/MediaAttachment',
                            },
                        },
                        parent_post_id: {
                            type: 'string',
                            format: 'uuid',
                            nullable: true,
                        },
                        quote_text: {
                            type: 'string',
                            nullable: true,
                        },
                        likes_count: {
                            type: 'integer',
                            example: 5,
                        },
                        comments_count: {
                            type: 'integer',
                            example: 2,
                        },
                        reposts_count: {
                            type: 'integer',
                            example: 1,
                        },
                        quotes_count: {
                            type: 'integer',
                            example: 0,
                        },
                        is_liked: {
                            type: 'boolean',
                            example: false,
                        },
                        is_reposted: {
                            type: 'boolean',
                            example: false,
                        },
                        is_bookmarked: {
                            type: 'boolean',
                            example: false,
                        },
                        user: {
                            $ref: '#/components/schemas/User',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00Z',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                        },
                    },
                },
                Comment: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440001',
                        },
                        post_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        user_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        parent_comment_id: {
                            type: 'string',
                            format: 'uuid',
                            nullable: true,
                        },
                        content: {
                            type: 'string',
                            example: 'This is a great post!',
                        },
                        media_attachments: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/MediaAttachment',
                            },
                        },
                        likes_count: {
                            type: 'integer',
                            example: 3,
                        },
                        replies_count: {
                            type: 'integer',
                            example: 1,
                        },
                        is_liked: {
                            type: 'boolean',
                            example: false,
                        },
                        user: {
                            $ref: '#/components/schemas/User',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                        },
                    },
                },
                PostLike: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        post_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        user_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        user: {
                            $ref: '#/components/schemas/User',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Repost: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        post_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        user_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        user: {
                            $ref: '#/components/schemas/User',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                Profile: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '550e8400-e29b-41d4-a716-446655440000',
                        },
                        first_name: {
                            type: 'string',
                            example: 'John',
                        },
                        last_name: {
                            type: 'string',
                            example: 'Doe',
                        },
                        country_code: {
                            type: 'string',
                            example: '+1',
                        },
                        phone_number: {
                            type: 'string',
                            example: '1234567890',
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'john@example.com',
                        },
                        avatar: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://cdn.example.com/avatars/john.jpg',
                        },
                        username: {
                            type: 'string',
                            example: 'johndoe',
                        },
                        bio: {
                            type: 'string',
                            example: 'This is my bio',
                        },
                        instagram: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://instagram.com/johndoe',
                        },
                        youtube: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://youtube.com/@johndoe',
                        },
                        twitter: {
                            type: 'string',
                            format: 'uri',
                            example: 'https://twitter.com/johndoe',
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00Z',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00Z',
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/**/*.ts'],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map