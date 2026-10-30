import { useState } from 'react';

const ROLES = [
  { key: 'primary', label: 'Primary', color: '#8b6fff' },
  { key: 'secondary', label: 'Secondary', color: '#38bdf8' },
  { key: 'accent', label: 'Accent', color: '#fbbf24' },
];

/**
 * RoleKanban
 * ----------
 * Three-column drag-and-drop list (Primary / Secondary / Accent).
 * - `elements`: array of {id, label, role, swatch}
 * - `onChangeRole(id, newRole)`: called when an item is dropped into a new column
 * - `onHover(id | null)`: called on mouse enter/leave to drive preview highlight
 */
export default function RoleKanban({ elements, onChangeRole, onHover }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverRole, setDragOverRole] = useState(null);

  return (
    <div className="kanban">
      {ROLES.map((role) => {
        const items = elements.filter((el) => el.role === role.key);
        return (
          <div
            key={role.key}
            className={`kanban-col ${dragOverRole === role.key ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverRole(role.key);
            }}
            onDragLeave={() => setDragOverRole(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverRole(null);
              if (draggingId) {
                onChangeRole(draggingId, role.key);
                setDraggingId(null);
              }
            }}
          >
            <div className="kanban-col-header">
              <span className="kanban-dot" style={{ background: role.color }} />
              <span className="kanban-col-name">{role.label}</span>
              <span className="kanban-col-count">{items.length}</span>
            </div>

            <div className="kanban-col-items">
              {items.length === 0 && (
                <div className="kanban-empty">drop elements here</div>
              )}
              {items.map((el) => (
                <div
                  key={el.id}
                  className="kanban-item"
                  draggable
                  onDragStart={() => setDraggingId(el.id)}
                  onDragEnd={() => setDraggingId(null)}
                  onMouseEnter={() => onHover(el.id)}
                  onMouseLeave={() => onHover(null)}
                >
                  <span className="kanban-swatch" style={{ background: el.swatch }} />
                  <span className="kanban-label">{el.label}</span>
                  <i className="ti ti-grip-vertical kanban-grip" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
