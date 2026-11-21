function getAllElementIds() {
  getAllAttributeValues("id")
}

function getAllDataIdAttribues() {
  getAllAttributeValues("data-id")
}

function getAllClassNames() {
  getAllAttributeValues("class")
}

function getAllAttributeValues(attribute_name) {
  const attribute_values = new Set()

  // get all attribute values for all matching elements
  const allElements = document.querySelectorAll('[' + attribute_name + ']')
  allElements.forEach(el => {
    attribute_values.add(el.getAttribute(attribute_name))
  });

  // report back the attribute values in a sorted list
  console.log(Array.from(attribute_values).sort())
}

function getAllAttributesInUse() {
  attributes = new Set()
  const usedAttributes = [..._getAllAttributesInUse(document.documentElement, attributes)].sort()
  return usedAttributes
}

function _getAllAttributesInUse(rootElement, attributes) {
  if (!rootElement || rootElement.nodeType !== Node.ELEMENT_NODE) {
    return attributes;
  }

  // Record all attribute names on the current element
  for (const attrName of rootElement.getAttributeNames()) {
    attributes.add(attrName);
  }

  // Recursively traverse element children (ignoring text/comment nodes)
  for (const child of rootElement.children) {
    _getAllAttributesInUse(child, attributes);
  }

  return attributes;
}

function getAllTagsInUse() {
  const usedTags = new Set(
    Array.from(document.getElementsByTagName('*'), el => el.tagName.toLowerCase()) // note tags in html are not case sensitive
  );

  return [...usedTags].sort()
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
