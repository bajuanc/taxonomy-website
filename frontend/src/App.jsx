import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import TaxonomyList from "./pages/TaxonomyList";
import TaxonomyDetail from "./pages/TaxonomyDetail";
import ActivityList from "./pages/ActivityList";
import ProjectReview from "./pages/ProjectReview";
import ObjectivesMatrix from "./pages/ObjectivesMatrix";

const App = () => {
  return (
    <Router>
      {/* Persistent header on every page */}
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/taxonomies" element={<TaxonomyList />} />
        <Route path="/taxonomies/:id" element={<TaxonomyDetail />} />

        {/* Alias route (works better than Navigate with a param) */}
        <Route path="/taxonomy/:id" element={<TaxonomyDetail />} />

        <Route
          path="/taxonomies/:taxonomyId/objectives/:objectiveId/sectors/:sectorId/activities"
          element={<ActivityList />}
        />
        <Route path="/project-review" element={<ProjectReview />} />
        <Route path="/objectives" element={<ObjectivesMatrix />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
