# INST 377 Group Project Deliverable

## Overview
Through the group project in the INST 377 class, students are expected to design and build a web application that runs on a real server (Node.js, etc.). Technology, design, **and** management must be well-justified in your presentations and documentation. Effective communication with both developers and non-technical people is a critical skill in the real world as well as in academia. Below are the evaluation criteria and submission requirements.


## Submission - **200pts**
For the final project, submit a link to a GitHub repository that satisfies the following requirements:
- **Team Collaboration**: All team members should contribute to the repository and appear as collaborators or contributors. One person will host the final project repository for submission. Other members may fork the project for their own copies.
- **Public Repository**: The GitHub repository must be public.
- **Deployment**: Deploy the project to **Vercel** and provide the deployment link.

## Final Reports

### **README (Top Half of README.md) - 15pts**
Include the following:
1. **Title** of your project  
2. **Description** of your project  
3. **Target Browsers**: Specify compatibility (iOS? Android? Which ones?)  
4. **Link to Developer Manual**  

### **Developer Manual (Bottom Half of README.md) - 15pts**
This document is for future developers with general web application knowledge but no prior understanding of your system. Provide a clear, technical guide for setting up and continuing development.

#### Include:
- How to **install your application** and its dependencies  
- How to **run your application** on a server  
- How to run **tests** for your software  
- A description of your **API endpoints**:  
  - All `GET`, `POST`, `PATCH`, etc., endpoints with descriptions of their functionality  
- Known **bugs** and a **roadmap** for future development  

#### Documentation Guidelines:
- Written in Markdown (MD) format and well-formatted  
- Saved under `docs` in your main project directory  

## Minimum Code Guidelines

### **Front End - 100pts**
The front end must meet the following requirements:
- Access data using **FetchAPI** calls:  
  - Minimum **3 Fetch calls**:  
    - 1 from an **external API** (from the API List in the Proposal)  
    - 2 from **backend APIs** designed in the project  
- Styled using **contemporary CSS** with appropriate use of Flexbox or Grids  
- Styles must appear consistent across **contemporary desktop browsers**  
- Utilize **2 JavaScript Libraries**:
  - Suggestions: Chart.js, Picture Slider, or other creative options  
- Include **3 application pages**:  
  1. **Home Page**  
  2. **About Page**  
  3. **Project-Specific Functionality Page**  
     - Core functionality of your application utilizing REST API and at least one JS Library  

### **Back End - 50pts**
The back end must meet the following requirements:
- Successfully connect to an **external data source**:  
  - Specifically, a **Supabase database**  
- Include **2 API endpoints**:  
  1. Retrieve data from your database  
  2. Either:  
     - Write data to your database  
     - Fetch and manipulate data from an external provider  
- Both APIs must be used by the **front end**  

## Deployment - **20pts**
The project must be:
- **Deployed to Vercel**  
- Fully functional  


## Extra Credit Opportunities
- Use **React** for your front end and design it to update dynamically.  
- Incorporate advanced **CSS animations** for all motion on the front end:  
  - Button clicks, screen transitions, etc.
