import React from "react";
import ChildRegistrationPage from "./ChildRegistrationPage";
import ChildrenListPage from "./ChildrenListPage";

const ChildrenDashboardPage: React.FC = () => (
  <div>
    <ChildRegistrationPage />
    <div className="">
      <ChildrenListPage />
    </div>
  </div>
);

export default ChildrenDashboardPage; 