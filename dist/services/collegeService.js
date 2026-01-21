"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCollege = exports.updateCollege = exports.getCollegeById = exports.getColleges = exports.createCollege = void 0;
const College_1 = __importDefault(require("../models/College"));
const createCollege = async (data) => {
    const existingCollege = await College_1.default.findOne({ name: data.name });
    if (existingCollege) {
        throw new Error('College with this name already exists');
    }
    return await College_1.default.create(data);
};
exports.createCollege = createCollege;
const getColleges = async () => {
    return await College_1.default.find({});
};
exports.getColleges = getColleges;
const getCollegeById = async (id) => {
    const college = await College_1.default.findById(id);
    if (!college) {
        throw new Error('College not found');
    }
    return college;
};
exports.getCollegeById = getCollegeById;
const updateCollege = async (id, data) => {
    const college = await College_1.default.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
    if (!college) {
        throw new Error('College not found');
    }
    return college;
};
exports.updateCollege = updateCollege;
const deleteCollege = async (id) => {
    const college = await College_1.default.findByIdAndDelete(id);
    if (!college) {
        throw new Error('College not found');
    }
    return college;
};
exports.deleteCollege = deleteCollege;
