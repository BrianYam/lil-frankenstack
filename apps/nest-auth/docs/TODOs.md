# TODOs

- [ ] Refactor all instances of `throw new ERROR` to use appropriate NestJS exception classes (e.g., `BadRequestException`, `UnauthorizedException`, etc.). Do not use the generic `ERROR` class. [ ]
- [ ] Build an OCR (Optical Character Recognition) module: [ ]
  - [ ] Design and implement a new module for OCR functionality. [ ]
  - [ ] Integrate OCR service and controller. [ ]
  - [ ] Add endpoints for image upload and text extraction. [ ]
  - [ ] Write unit and integration tests for the OCR module. [ ]
- [ ] Fix Telegraf 409 Conflict error: Use webhook instead of polling in production to avoid multiple bot instance conflicts. [ ]
