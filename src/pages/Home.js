import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>PAUL - Proposal Automation Library</h1>
      <nav>
        <ul>
          <li><Link to="/template-upload">Upload Template</Link></li>
          <li><Link to="/document-upload">Upload Documents</Link></li>
          <li><Link to="/generate-proposal">Generate Proposal</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Home;