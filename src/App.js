import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ProposalGeneration from './pages/ProposalGeneration';
import TemplateUpload from './pages/TemplateUpload';
import DocumentUpload from './pages/DocumentUpload';
import { GoogleAuthProvider } from './components/google/GoogleAuthProvider';

function App() {
  return (
    <GoogleAuthProvider>
      <Router>
        <div className="App">
          <Switch>
            <Route exact path="/" component={ProposalGeneration} />
            <Route path="/upload-template" component={TemplateUpload} />
            <Route path="/upload-documents" component={DocumentUpload} />
            <Route path="/google-auth-callback" render={() => (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <h2>Completing Google Authentication...</h2>
                <p>Please wait while we complete the authentication process.</p>
              </div>
            )} />
          </Switch>
        </div>
      </Router>
    </GoogleAuthProvider>
  );
}

export default App;