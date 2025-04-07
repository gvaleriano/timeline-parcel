import React, { useState, useEffect, useRef } from 'react';

/**
 * Takes an array of items and assigns them to lanes based on start/end dates.
 * @returns an array of lanes, each containing items.
 */
function assignLanesToItems(items) {
  if (!items || items.length === 0) {
    return [];
  }

  const sortedItems = [...items].sort((a, b) =>
    new Date(a.start) - new Date(b.start)
  );
  const lanes = [];

  function assignItemToLane(item) {
    for (const lane of lanes) {
      if (new Date(lane[lane.length - 1].end) < new Date(item.start)) {
        lane.push(item);
        return;
      }
    }
    lanes.push([item]);
  }

  for (const item of sortedItems) {
    assignItemToLane(item);
  }
  return lanes;
}

export default function Timeline() {
  // Initialize with empty arrays to prevent null/undefined errors
  const [items, setItems] = useState([]);
  const [lanes, setLanes] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [draggingItem, setDraggingItem] = useState(null);
  const [dragType, setDragType] = useState(null); // 'start', 'end', or 'move'
  const [dragStartX, setDragStartX] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const timelineRef = useRef(null);

  // Safe calculation of min and max dates with fallbacks
  const calculateDateRange = () => {
    if (!items || items.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
      };
    }

    try {
      const minDate = new Date(Math.min(...items.map(item => new Date(item.start).getTime())));
      const maxDate = new Date(Math.max(...items.map(item => new Date(item.end).getTime())));
      
      // Add padding
      const minDateWithPadding = new Date(minDate);
      minDateWithPadding.setDate(minDateWithPadding.getDate() - 7);
      
      const maxDateWithPadding = new Date(maxDate);
      maxDateWithPadding.setDate(maxDateWithPadding.getDate() + 7);
      
      return {
        minDate: minDateWithPadding,
        maxDate: maxDateWithPadding
      };
    } catch (e) {
      console.error("Error calculating date range:", e);
      const today = new Date();
      return {
        minDate: today,
        maxDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30)
      };
    }
  };

  // Fetch data from JSON server
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    fetch('http://localhost:3000/timelines')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (isMounted) {
          setItems(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching timeline data:', err);
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      });
      
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this runs once on mount

  // Assign lanes when items change
  useEffect(() => {
    try {
      const lanesArray = assignLanesToItems(items);
      setLanes(lanesArray);
    } catch (err) {
      console.error('Error assigning lanes:', err);
      setLanes([]);
    }
  }, [items]);

  // Safe date range calculation
  const { minDate, maxDate } = calculateDateRange();
  
  // Date range for the timeline (in days)
  const totalDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));

  // Calculate position and width for an item
  const getItemStyle = (item) => {
    try {
      const startDays = Math.floor((new Date(item.start) - minDate) / (1000 * 60 * 60 * 24));
      const endDays = Math.ceil((new Date(item.end) - minDate) / (1000 * 60 * 60 * 24));
      const itemWidth = Math.max((endDays - startDays) * 24 * zoomLevel, 80); // Min width for small items
      
      return {
        left: `${startDays * 24 * zoomLevel}px`,
        width: `${itemWidth}px`,
        backgroundColor: item.color || '#4287f5'
      };
    } catch (e) {
      console.error("Error calculating item style:", e);
      return {
        left: '0px',
        width: '80px',
        backgroundColor: '#4287f5'
      };
    }
  };

  // Handle zooming
  const handleZoom = (zoomIn) => {
    setZoomLevel(prevZoom => {
      const newZoom = zoomIn ? prevZoom * 1.2 : prevZoom / 1.2;
      return Math.max(0.5, Math.min(5, newZoom)); // Limit zoom between 0.5x and 5x
    });
  };

  // Start dragging an item
  const startDrag = (e, item, type) => {
    setDraggingItem(item);
    setDragType(type);
    setDragStartX(e.clientX);
    e.stopPropagation();
  };

  // Handle drag movement
  const handleDrag = (e) => {
    if (!draggingItem) return;

    const deltaX = e.clientX - dragStartX;
    const daysDelta = Math.round(deltaX / (24 * zoomLevel));
    
    if (daysDelta === 0) return;
    
    setDragStartX(e.clientX);
    
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id !== draggingItem.id) return item;
        
        const itemCopy = {...item};
        const start = new Date(item.start);
        const end = new Date(item.end);
        
        // Handle different drag types
        if (dragType === 'start') {
          start.setDate(start.getDate() + daysDelta);
          // Ensure start doesn't go past end
          if (start < end) {
            itemCopy.start = start.toISOString().split('T')[0];
          }
        } else if (dragType === 'end') {
          end.setDate(end.getDate() + daysDelta);
          // Ensure end doesn't go before start
          if (end > start) {
            itemCopy.end = end.toISOString().split('T')[0];
          }
        } else if (dragType === 'move') {
          start.setDate(start.getDate() + daysDelta);
          end.setDate(end.getDate() + daysDelta);
          itemCopy.start = start.toISOString().split('T')[0];
          itemCopy.end = end.toISOString().split('T')[0];
        }
        
        return itemCopy;
      });
    });
  };

  // End dragging
  const endDrag = () => {
    setDraggingItem(null);
    setDragType(null);
  };

  // Start editing an item name
  const startEdit = (item, e) => {
    e.stopPropagation();
    setEditingItem(item.id);
    setEditingText(item.name);
  };

  // Save the edited name
  const saveEdit = () => {
    if (!editingItem) return;
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === editingItem 
          ? { ...item, name: editingText } 
          : item
      )
    );
    
    setEditingItem(null);
    setEditingText('');
  };

  // Handle mouse events for drag operations
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingItem) {
        handleDrag(e);
      }
    };
    
    const handleMouseUp = () => {
      if (draggingItem) {
        endDrag();
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingItem, dragStartX, dragType]);

  // Generate month labels for the timeline
  const renderMonthLabels = () => {
    const months = [];
    let currentDate = new Date(minDate);
    
    while (currentDate <= maxDate) {
      const monthStart = new Date(currentDate);
      const monthStartDays = Math.floor((monthStart - minDate) / (1000 * 60 * 60 * 24));
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      months.push(
        <div 
          key={`${monthName}-${monthStartDays}`}
          className="absolute border-l border-gray-300"
          style={{ left: `${monthStartDays * 24 * zoomLevel}px` }}
        >
          <div className="pl-1 text-xs text-gray-500">{monthName}</div>
        </div>
      );
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
    }
    
    return months;
  };

  // Show loading state
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading timeline data...</div>;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-500">
        <p>Error loading timeline data: {error}</p>
        <p className="text-sm mt-2">Make sure json-server is running at http://localhost:3000</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Project Timeline</h1>
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded" 
            onClick={() => handleZoom(false)}
          >
            Zoom Out
          </button>
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded"
            onClick={() => handleZoom(true)}
          >
            Zoom In
          </button>
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p>No timeline items found. Please add some items to your JSON server.</p>
        </div>
      ) : (
        <div className="relative overflow-x-auto border border-gray-200 rounded" ref={timelineRef}>
          {/* Timeline header with month labels */}
          <div className="sticky top-0 h-8 bg-gray-50 border-b border-gray-200 z-10">
            <div className="relative h-full" style={{ width: `${totalDays * 24 * zoomLevel}px` }}>
              {renderMonthLabels()}
            </div>
          </div>
          
          {/* Timeline content with lanes */}
          <div className="relative" style={{ width: `${totalDays * 24 * zoomLevel}px` }}>
            {lanes.map((lane, laneIndex) => (
              <div 
                key={`lane-${laneIndex}`} 
                className="relative h-12 border-b border-gray-100"
              >
                {lane.map(item => (
                  <div
                    key={item.id}
                    className="absolute top-1 h-10 rounded cursor-pointer flex items-center px-2 shadow-sm"
                    style={getItemStyle(item)}
                    onClick={(e) => startDrag(e, item, 'move')}
                  >
                    {/* Drag handle for start date */}
                    <div 
                      className="absolute top-0 left-0 w-1 h-full cursor-w-resize bg-white opacity-0 hover:opacity-50"
                      onMouseDown={(e) => startDrag(e, item, 'start')}
                    />
                    
                    {/* Item content */}
                    <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-white">
                      {editingItem === item.id ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-transparent text-white outline-none"
                          autoFocus
                        />
                      ) : (
                        <span onDoubleClick={(e) => startEdit(item, e)}>
                          {item.name}
                        </span>
                      )}
                    </div>
                    
                    {/* Drag handle for end date */}
                    <div 
                      className="absolute top-0 right-0 w-1 h-full cursor-e-resize bg-white opacity-0 hover:opacity-50"
                      onMouseDown={(e) => startDrag(e, item, 'end')}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        <p>Double-click an item to edit its name. Drag edges to resize or the center to move.</p>
      </div>
    </div>
  );
}