import React from 'react';

const Farms = () => {
  return (
    <div className="page">
      <div className="page__header">
        <h1>Farms Management</h1>
        <p>Manage and monitor your farm properties</p>
      </div>
      
      <div className="page__content">
        <div className="card">
          <h3>Farms Overview</h3>
          <p>This page will show all farms with their details, status, and management options.</p>
          <p>Features will include:</p>
          <ul>
            <li>Farm listing with search and filters</li>
            <li>Add new farms</li>
            <li>Edit farm details</li>
            <li>View farm statistics</li>
            <li>Crop and sensor assignments</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Farms;
