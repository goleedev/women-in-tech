import { BrowserRouter as Router, Route } from 'react-router-dom';
import Mentorship from './pages/Mentorship';

const App = () => {
  return (
    <Router>
      <Route path="/" children={<h1>Home Page</h1>} />
      <Route path="/mentorship" children={<Mentorship />} />
    </Router>
  );
};

export default App;
