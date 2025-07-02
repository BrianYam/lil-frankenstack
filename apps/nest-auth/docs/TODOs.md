# TODOs

- [x] Refactor all instances of `throw new ERROR` to use appropriate NestJS exception classes (e.g., `BadRequestException`, `UnauthorizedException`, etc.). Do not use the generic `ERROR` class. [2025-06-30]
- [ ] Build an OCR (Optical Character Recognition) module: [ ]
  - [ ] Design and implement a new module for OCR functionality. [ ]
  - [ ] Integrate OCR service and controller. [ ]
  - [ ] Add endpoints for image upload and text extraction. [ ]
  - [ ] Write unit and integration tests for the OCR module. [ ]
- [x] Fix Telegraf 409 Conflict error: Use webhook instead of polling in production to avoid multiple bot instance conflicts. [2025-06-29]
- [x] Build a proper config module for managing application configuration. [2025-07-02]
- [x] Rename userEmailJwt guard and strategy to userAuthJwt for clarity and consistency. [2025-06-30]
