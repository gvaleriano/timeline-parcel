# Timeline Component

A React component for visualizing items on a horizontal timeline with compact lane arrangement.

## Features

- Items are arranged in horizontal lanes in a space-efficient way
- Zooming functionality to adjust the timeline view
- Drag and drop support for adjusting item dates
  - Drag center to move the entire item
  - Drag edges to adjust start/end dates
- Inline editing of item names (double-click)
- Month labels for easier date reference
- Minimum width enforcement for very short items to ensure readability

## Implementation Details

The timeline component takes an array of items with:
- id (unique identifier)
- name (display name)
- startDate (in YYYY-MM-DD format)
- endDate (in YYYY-MM-DD format)
- color (optional - for item background)

## What I Like About My Implementation

1. **Space Efficiency**: The lane allocation algorithm ensures items are arranged compactly.
2. **Intuitive Interactions**: The component uses familiar interaction patterns - dragging to resize/move and double-clicking to edit.
3. **Responsive Design**: The zoom functionality makes it easy to view different time scales.
4. **Visual Clarity**: Items have distinct colors and clear boundaries, with labels that are legible even for shorter items.
5. **Minimal Dependencies**: The implementation avoids unnecessary libraries and focuses on clean React code.

## What I Would Change Given More Time

1. **Performance Optimization**: For large datasets, I would implement virtualization to render only visible items.
2. **Date Navigation**: Add buttons to jump to specific time periods or implement a mini-map for easier navigation.
3. **Accessibility Improvements**: Enhance keyboard navigation and screen reader support.
4. **Data Management**: Implement proper state management (Redux, Context API) for complex applications.
5. **Custom Date Formatting**: Allow configurable date formats and time scales (weeks, months, quarters).

## How I Would Test This

Given more time, I would implement the following testing strategy:

1. **Unit Tests**:
   - Test the lane assignment algorithm with various item arrangements
   - Verify date calculations and positioning logic
   - Test edge cases (very short items, items spanning long periods)

2. **Integration Tests**:
   - Test zoom functionality and its effect on item positioning
   - Verify drag and drop behavior modifies dates correctly
   - Test inline editing saves properly

3. **User Testing**:
   - Conduct usability sessions to identify friction points
   - Get feedback on clarity of the interface

4. **Performance Testing**:
   - Measure and optimize render performance with large datasets
   - Test browser compatibility

## Running the Project

1. Clone the repository
2. Install dependencies: `npm install` or `yarn`
3. Start the development server: `npm start` or `yarn start`
4. Open your browser to the local development URL (typically http://localhost:3000 but at this project the port is 1234)

The timeline will load with the sample data from `src/timelineItems.js in db.json file` using json-server a fake api to simulate requests.
