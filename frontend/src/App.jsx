import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import TaxonomyList from "./pages/TaxonomyList";
import TaxonomyDetail from "./pages/TaxonomyDetail";
import ActivityList from "./pages/ActivityList";
import ProjectReview from "./pages/ProjectReview";
import ObjectivesMatrix from "./pages/ObjectivesMatrix";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/taxonomies" element={<TaxonomyList />} />
        <Route path="/taxonomies/:id" element={<TaxonomyDetail />} />
        <Route
          path="/taxonomies/:taxonomyId/objectives/:objectiveId/sectors/:sectorId/activities"
          element={<ActivityList />}
        />
        <Route path="/taxonomy/:id" element={<Navigate to="/taxonomies/:id" replace />} />
        <Route path="/project-review" element={<ProjectReview />} />
        <Route path="/objectives" element={<ObjectivesMatrix />} />
      </Routes>
    </Router>
  );
};

export default App;
