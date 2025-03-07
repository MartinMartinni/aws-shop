"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
class HttpError extends Error {
    constructor(response) {
        super();
        this.response = response;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXhjZXB0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkV4Y2VwdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBYSxTQUFVLFNBQVEsS0FBSztJQUdoQyxZQUFZLFFBQWtCO1FBQzFCLEtBQUssRUFBRSxDQUFBO1FBQ1AsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFFekIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3JELENBQUM7Q0FDSjtBQVRELDhCQVNDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIEh0dHBFcnJvciBleHRlbmRzIEVycm9yIHtcclxuXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgcmVzcG9uc2U6IFJlc3BvbnNlO1xyXG4gICAgY29uc3RydWN0b3IocmVzcG9uc2U6IFJlc3BvbnNlKSB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIHRoaXMucmVzcG9uc2UgPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgT2JqZWN0LnNldFByb3RvdHlwZU9mKHRoaXMsIEh0dHBFcnJvci5wcm90b3R5cGUpO1xyXG4gICAgfVxyXG59Il19