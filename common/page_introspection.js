function probe_elements_with_ids() {
    // Select all elements that have an id attribute
    const elementsWithIds = document.querySelectorAll('[id]');

    // Print the total count of IDs found
    console.log(`Total elements with IDs found: ${elementsWithIds.length}`);

    // Print each element and its ID to the console
    elementsWithIds.forEach(element => {
        console.log(`ID: "${element.id}"`);
    });
}


function getAllShadowRoots(root = document) {
  const shadowRoots = [];
  
  // Find all elements under the current root node
  const allElements = root.querySelectorAll('*');
  
  allElements.forEach(el => {
    // If the element hosts an open shadow root, grab it
    if (el.shadowRoot) {
      shadowRoots.push(el.shadowRoot);
      // Recursively search inside this shadow root for nested trees
      shadowRoots.push(...getAllShadowRoots(el.shadowRoot));
    }
  });
  
  console.log(shadowRoots)
}
