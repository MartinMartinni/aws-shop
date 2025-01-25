"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.TransferType = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["COMPLETED"] = "COMPLETED";
    OrderStatus["FAILURE"] = "FAILURE";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var TransferType;
(function (TransferType) {
    TransferType["DEBIT"] = "DEBIT";
    TransferType["CREDIT"] = "CREDIT";
})(TransferType || (exports.TransferType = TransferType = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kZWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiTW9kZWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVFBLElBQVksV0FJWDtBQUpELFdBQVksV0FBVztJQUNuQixrQ0FBbUIsQ0FBQTtJQUNuQixzQ0FBdUIsQ0FBQTtJQUN2QixrQ0FBbUIsQ0FBQTtBQUN2QixDQUFDLEVBSlcsV0FBVywyQkFBWCxXQUFXLFFBSXRCO0FBNkJELElBQVksWUFHWDtBQUhELFdBQVksWUFBWTtJQUNwQiwrQkFBZSxDQUFBO0lBQ2YsaUNBQWlCLENBQUE7QUFDckIsQ0FBQyxFQUhXLFlBQVksNEJBQVosWUFBWSxRQUd2QjtBQVFELElBQVksUUFHWDtBQUhELFdBQVksUUFBUTtJQUNoQiwyQkFBZSxDQUFBO0lBQ2YseUJBQWEsQ0FBQTtBQUNqQixDQUFDLEVBSFcsUUFBUSx3QkFBUixRQUFRLFFBR25CIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGludGVyZmFjZSBQcm9kdWN0IHtcclxuICAgIGlkOiBzdHJpbmdcclxuICAgIGNyZWF0ZWRBdDogc3RyaW5nXHJcbiAgICBuYW1lOiBzdHJpbmcsXHJcbiAgICBpbWc6IHN0cmluZyxcclxuICAgIHByaWNlOiBudW1iZXIsXHJcbiAgICBxdWFudGl0eTogbnVtYmVyXHJcbn1cclxuZXhwb3J0IGVudW0gT3JkZXJTdGF0dXMge1xyXG4gICAgUEVORElORyA9IFwiUEVORElOR1wiLFxyXG4gICAgQ09NUExFVEVEID0gXCJDT01QTEVURURcIixcclxuICAgIEZBSUxVUkUgPSBcIkZBSUxVUkVcIlxyXG59XHJcbmV4cG9ydCBpbnRlcmZhY2UgT3JkZXIge1xyXG4gICAgaWQ6IG51bWJlcjtcclxuICAgIHVzZXJJZDogc3RyaW5nO1xyXG4gICAgb3JkZXJTdGF0dXM6IE9yZGVyU3RhdHVzO1xyXG4gICAgcHJpY2U6IG51bWJlcjtcclxuICAgIGl0ZW1zOiBPcmRlckl0ZW1zW107XHJcbiAgICBhZGRyZXNzOiBBZGRyZXNzO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE9yZGVySXRlbXMge1xyXG4gICAgaWQ6IG51bWJlcjtcclxuICAgIHByb2R1Y3RJZDogc3RyaW5nO1xyXG4gICAgcHJvZHVjdE5hbWU6IHN0cmluZztcclxuICAgIHByb2R1Y3RJbWc6IHN0cmluZztcclxuICAgIHF1YW50aXR5OiBudW1iZXI7XHJcbiAgICBwcmljZTogbnVtYmVyO1xyXG4gICAgc3ViVG90YWw6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBZGRyZXNzIHtcclxuICAgIGNvdW50cnk6IHN0cmluZztcclxuICAgIGNpdHk6IHN0cmluZztcclxuICAgIHBvc3RDb2RlOiBzdHJpbmc7XHJcbiAgICBzdHJlZXQ6IHN0cmluZztcclxuICAgIGhvdXNlTnVtYmVyOiBzdHJpbmc7XHJcbiAgICBsb2NhbE51bWJlcjogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgZW51bSBUcmFuc2ZlclR5cGUge1xyXG4gICAgREVCSVQgPSBcIkRFQklUXCIsXHJcbiAgICBDUkVESVQgPSBcIkNSRURJVFwiXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgVXNlckJhbmtBY2NvdW50SGlzdG9yeSB7XHJcbiAgICBpZDogc3RyaW5nLFxyXG4gICAgdXNlcklkOiBzdHJpbmcsXHJcbiAgICBhbW91bnRPZk1vbmV5OiBudW1iZXJcclxuICAgIHRyYW5zZmVyVHlwZTogVHJhbnNmZXJUeXBlXHJcbn1cclxuZXhwb3J0IGVudW0gVXNlclJvbGUge1xyXG4gICAgQURNSU4gPSBcIkFETUlOXCIsXHJcbiAgICBVU0VSID0gXCJVU0VSXCJcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBVc2VyIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBzdWI6IHN0cmluZztcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGVtYWlsOiBzdHJpbmc7XHJcbiAgICBhbW91bnRPZk1vbmV5OiBudW1iZXI7XHJcbiAgICBwYXNzd29yZDogc3RyaW5nO1xyXG4gICAgcm9sZTogVXNlclJvbGVcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZXF1ZXN0RXJyb3JGaWVsZCB7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBwYXRoOiBzdHJpbmc7XHJcbn0iXX0=