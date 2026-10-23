import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * SwipeableRow Component
 * Provides a fluid, real-time mouse/touch gesture wrapper for table rows.
 * - Slide Right (left -> right): Reveals red "Remove BL" button on the left.
 * - Slide Left (right -> left): Reveals blue "Edit / View" button on the right.
 * - Snap threshold: 60px (snaps open to 140px, otherwise snaps shut).
 * - Security gate on delete: Requires password "abcd".
 */
export const SwipeableRow = ({
  children,
  onRemove,
  onEditView,
  onClick,
  className = '',
  style = {},
  rowId = '',
  isOpen = false,
  onOpenChange
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentTranslateRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const isHorizontalDragRef = useRef(false);
  const rowRef = useRef(null);

  const SNAP_WIDTH = 140;
  const SNAP_THRESHOLD = 60;

  // Sync with external open state (e.g. when another row opens)
  useEffect(() => {
    if (!isOpen && !isDragging) {
      setTranslateX(0);
      currentTranslateRef.current = 0;
    }
  }, [isOpen, isDragging]);

  const snapTo = useCallback((val) => {
    setTranslateX(val);
    currentTranslateRef.current = val;
    if (onOpenChange) {
      onOpenChange(val !== 0 ? rowId : null);
    }
  }, [onOpenChange, rowId]);

  const snapShut = useCallback(() => {
    snapTo(0);
  }, [snapTo]);

  // Pointer Down (mouse click or touch)
  const handlePointerDown = (e) => {
    // Only primary button
    if (e.button && e.button !== 0) return;
    
    // Ignore clicks directly on interactive action buttons
    if (e.target.closest('button, a, input, select, textarea')) {
      return;
    }

    isPointerDownRef.current = true;
    isHorizontalDragRef.current = false;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  // Pointer Move (real-time tracking)
  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    // Detect horizontal vs vertical scroll on initial movement
    if (!isHorizontalDragRef.current) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 6) {
        // User is scrolling vertically, release gesture tracking
        isPointerDownRef.current = false;
        return;
      }
      if (Math.abs(deltaX) > 6) {
        isHorizontalDragRef.current = true;
        setIsDragging(true);
      }
    }

    if (isHorizontalDragRef.current) {
      const base = currentTranslateRef.current;
      let newX = base + deltaX;

      // Apply resistance when dragging beyond max action width
      const MAX_PULL = 175;
      if (newX > MAX_PULL) {
        newX = MAX_PULL + (newX - MAX_PULL) * 0.25;
      } else if (newX < -MAX_PULL) {
        newX = -MAX_PULL + (newX + MAX_PULL) * 0.25;
      }

      setTranslateX(newX);
    }
  };

  // Pointer Up / Cancel (Snap to open or shut)
  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const deltaX = e.clientX - startXRef.current;
    isPointerDownRef.current = false;

    if (!isHorizontalDragRef.current) {
      // It was a tap / click without drag
      if (currentTranslateRef.current !== 0) {
        snapShut();
      } else if (onClick) {
        onClick(e);
      }
      setIsDragging(false);
      return;
    }

    setIsDragging(false);
    isHorizontalDragRef.current = false;

    const base = currentTranslateRef.current;
    const finalX = base + deltaX;

    // Snap Open Right (Delete button revealed)
    if (finalX > SNAP_THRESHOLD) {
      snapTo(SNAP_WIDTH);
    } 
    // Snap Open Left (Edit / View button revealed)
    else if (finalX < -SNAP_THRESHOLD) {
      snapTo(-SNAP_WIDTH);
    } 
    // Snap Shut
    else {
      snapShut();
    }
  };

  // Delete Action Gate (Password: "abcd")
  const handleDeleteAction = (e) => {
    e.stopPropagation();
    
    let enteredPassword = null;
    try {
      enteredPassword = window.prompt(
        '🔒 Security Verification Required:\nEnter authorization password to remove this BL:'
      );
    } catch {
      window.alert('❌ Unauthorized: Unable to open security prompt.');
      snapShut();
      return;
    }

    if (enteredPassword === 'abcd') {
      if (onRemove) {
        onRemove();
      }
    } else {
      window.alert('❌ Unauthorized: Incorrect password. BL was not deleted.');
    }
    
    snapShut();
  };

  // Edit / View Action
  const handleEditViewAction = (e) => {
    e.stopPropagation();
    if (onEditView) {
      onEditView();
    }
    snapShut();
  };

  const childrenArray = React.Children.toArray(children);
  const totalChildren = childrenArray.length;

  return (
    <tr
      ref={rowRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`select-none transition-colors ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'} hover:bg-slate-800/30 ${className}`}
      style={{
        ...style,
        touchAction: 'pan-y'
      }}
    >
      {childrenArray.map((child, index) => {
        if (!React.isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === totalChildren - 1;

        // Apply real-time translation to every cell in the row
        const cellStyle = {
          ...(child.props.style || {}),
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        };

        return React.cloneElement(child, {
          style: cellStyle,
          children: (
            <>
              {/* 1. In First Cell: Revealed RED "Remove Voucher" Button (Slide Right) */}
              {isFirst && translateX > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: `${Math.min(translateX, 160)}px`,
                    transform: `translateX(${-translateX}px)`, // counter-translate to stay pinned at left edge
                    zIndex: 40
                  }}
                  className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 flex items-center px-2.5 shadow-md overflow-hidden whitespace-nowrap pointer-events-auto"
                >
                  <button
                    type="button"
                    onClick={handleDeleteAction}
                    className="px-2.5 py-1 bg-red-900/90 hover:bg-red-950 text-white text-[11px] font-semibold tracking-wide rounded border border-red-400/30 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="Remove BL (Password: abcd)"
                  >
                    Remove BL
                  </button>
                </div>
              )}

              {/* Cell's actual content */}
              {child.props.children}

              {/* 2. In Last Cell: Revealed BLUE "Edit / View" Button (Slide Left) */}
              {isLast && translateX < 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: `${Math.min(-translateX, 160)}px`,
                    transform: `translateX(${-translateX}px)`, // counter-translate to stay pinned at right edge
                    zIndex: 40
                  }}
                  className="bg-gradient-to-l from-blue-600 via-sky-600 to-indigo-700 flex items-center justify-end px-2.5 shadow-md overflow-hidden whitespace-nowrap pointer-events-auto"
                >
                  <button
                    type="button"
                    onClick={handleEditViewAction}
                    className="px-2.5 py-1 bg-blue-900/90 hover:bg-blue-950 text-white text-[11px] font-semibold tracking-wide rounded border border-sky-400/30 shadow-xs transition-all active:scale-95 cursor-pointer"
                    title="Edit / View BL Dossier"
                  >
                    Edit / View
                  </button>
                </div>
              )}
            </>
          )
        });
      })}
    </tr>
  );
};

export default SwipeableRow;
