import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Study from './pages/Study';
import Test from './pages/Test';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="study/:dayId" element={<Study />} />
        <Route path="test/:dayId" element={<Test />} />
      </Route>
    </Routes>
  );
}

export default App;
