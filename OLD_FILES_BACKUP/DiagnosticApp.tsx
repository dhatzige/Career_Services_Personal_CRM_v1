import React, { useState } from 'react';

console.log('DiagnosticApp loading...');

// Test 1: Basic React
function TestBasicReact() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <h2>Test 1: Basic React ✅</h2>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  );
}

// Test 2: Context
const TestContext = React.createContext<any>(null);

function TestContextProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState('context works');
  return (
    <TestContext.Provider value={{ value, setValue }}>
      {children}
    </TestContext.Provider>
  );
}

function TestContextConsumer() {
  const context = React.useContext(TestContext);
  return <p>Test 2: Context - {context?.value || 'FAILED'} ✅</p>;
}

// Test 3: Router
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

function RouterTest() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>Test 3: Router ✅</h2>
      <button onClick={() => navigate('/page2')}>Navigate to Page 2</button>
    </div>
  );
}

function Page2() {
  return <h2>Page 2 - Navigation worked! ✅</h2>;
}

// Main Diagnostic App
function DiagnosticApp() {
  console.log('DiagnosticApp rendering...');
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>React Diagnostic Tests</h1>
      
      <TestBasicReact />
      
      <TestContextProvider>
        <TestContextConsumer />
      </TestContextProvider>
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RouterTest />} />
          <Route path="/page2" element={<Page2 />} />
        </Routes>
      </BrowserRouter>
      
      <hr />
      <p>React version: {React.version}</p>
      <p>If all tests show ✅, React is working properly.</p>
    </div>
  );
}

export default DiagnosticApp;