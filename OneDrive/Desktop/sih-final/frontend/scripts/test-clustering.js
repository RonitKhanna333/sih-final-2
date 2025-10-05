// Quick test script to check if clustering API works
const API_BASE = 'http://localhost:3000/api';

async function testClustering() {
  try {
    console.log('Testing clustering API...');
    
    // First check if there's feedback
    const feedbackResponse = await fetch(`${API_BASE}/feedback`);
    const feedbackData = await feedbackResponse.json();
    console.log(`Feedback count: ${feedbackData.length || 0}`);
    
    if (feedbackData.length === 0) {
      console.log('No feedback found! Run seed script first.');
      return;
    }
    
    // Now test clustering
    const clusterResponse = await fetch(`${API_BASE}/clustering`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ num_clusters: 3 })
    });
    
    const clusterData = await clusterResponse.json();
    console.log('Clustering result:', JSON.stringify(clusterData, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testClustering();
