import React, { useState } from "react";
import Input from "../components/Input";
import Select from "../components/Select";
import Textarea from "../components/Textarea";
import Button from "../components/Button";
import Card, { CardHeader, CardBody, CardFooter } from "../components/Card";

const gradeOptions = [
  { value: "kindergarten", label: "Kindergarten" },
  { value: "1st", label: "1st Grade" },
  { value: "2nd", label: "2nd Grade" },
  { value: "3rd", label: "3rd Grade" },
  { value: "4th", label: "4th Grade" },
  { value: "5th", label: "5th Grade" },
  { value: "6th", label: "6th Grade" },
];

const parentOptions = [
  { value: "parent1", label: "John Doe" },
  { value: "parent2", label: "Jane Smith" },
];

// Mock children data for demonstration
const MOCK_CHILDREN = [
  {
    id: "1",
    name: "Lucas Silva",
    age: 8,
    grade: "3º ano",
    classType: "Presencial",
  },
  {
    id: "2",
    name: "Maria Souza",
    age: 10,
    grade: "5º ano",
    classType: "Online",
  },
];

const ChildRegistrationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    grade: "",
    difficulties: "",
    condition: "",
    classType: "in-person",
    parent: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      classType: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the data to a backend
    console.log("Form submitted:", formData);

    // Reset form after submission
    setFormData({
      name: "",
      age: "",
      grade: "",
      difficulties: "",
      condition: "",
      classType: "in-person",
      parent: "",
    });

    // Show success message or redirect
    alert("Child registered successfully!");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-800">Register a Child</h1>
          <p className="mt-1 text-gray-600">
            Please provide information about your child to help us tailor the
            tutoring experience.
          </p>
        </CardHeader>

        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Child's Full Name"
                id="name"
                name="name"
                placeholder="Enter child's name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Age"
                id="age"
                name="age"
                type="number"
                placeholder="Enter child's age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>

            <Select
              label="School Grade"
              id="grade"
              name="grade"
              options={gradeOptions}
              value={formData.grade}
              onChange={handleChange}
              placeholder="Select grade"
              required
            />

            <Textarea
              label="Learning Difficulties (if any)"
              id="difficulties"
              name="difficulties"
              placeholder="Describe any learning difficulties or special educational needs"
              value={formData.difficulties}
              onChange={handleChange}
            />

            <Textarea
              label="Personal Condition"
              id="condition"
              name="condition"
              placeholder="Any medical conditions, allergies, or personal preferences we should know about"
              value={formData.condition}
              onChange={handleChange}
            />

            <div className="space-y-2">
              <p className="block text-sm font-medium text-gray-700">
                Class Type
              </p>
              <div className="flex space-x-6">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-indigo-600"
                    name="classType"
                    value="online"
                    checked={formData.classType === "online"}
                    onChange={handleRadioChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">Online</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-indigo-600"
                    name="classType"
                    value="in-person"
                    checked={formData.classType === "in-person"}
                    onChange={handleRadioChange}
                  />
                  <span className="ml-2 text-sm text-gray-700">In-person</span>
                </label>
              </div>
            </div>

            <Select
              label="Parent/Guardian"
              id="parent"
              name="parent"
              options={parentOptions}
              value={formData.parent}
              onChange={handleChange}
              placeholder="Link to responsible parent"
              required
            />
          </form>
        </CardBody>

        <CardFooter className="flex justify-end">
          <Button variant="outline" className="mr-3">
            Cancel
          </Button>
          <Button type="submit">Register Child</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChildRegistrationPage;
