import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ProposalGeneration from './pages/ProposalGeneration';
import TemplateUpload from './pages/TemplateUpload';
import DocumentUpload from './pages/DocumentUpload';

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/" component={ProposalGeneration} />
          <Route path="/upload-template" component={TemplateUpload} />
          <Route path="/upload-documents" component={DocumentUpload} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;