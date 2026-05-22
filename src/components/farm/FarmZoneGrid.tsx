import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface FarmItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
  available: number;
}

interface GridCell {
  row: number;
  col: number;
  item: FarmItem | null;
}

interface FarmZoneGridProps {
  zoneName: string;
  zoneType: string;
  availableItems: FarmItem[];
  isDaytime: boolean;
  gridRows: number;
  gridCols: number;
  onInventoryChange: (itemId: string, delta: number) => void;
}

const FarmZoneGrid = ({ 
  zoneName, 
  zoneType, 
  availableItems, 
  isDaytime, 
  gridRows, 
  gridCols,
  onInventoryChange 
}: FarmZoneGridProps) => {
  const GRID_ROWS = gridRows;
  const GRID_COLS = gridCols;
  
  const [grid, setGrid] = useState<GridCell[]>(() => {
    const initialGrid: GridCell[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        initialGrid.push({ row, col, item: null });
      }
    }
    return initialGrid;
  });
  
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCellClick = (row: number, col: number) => {
    const cell = grid.find(c => c.row === row && c.col === col);
    if (cell?.item) {
      // Remove item if cell has one - return to inventory
      const itemId = cell.item.id;
      setGrid(prev => prev.map(c => 
        c.row === row && c.col === col ? { ...c, item: null } : c
      ));
      onInventoryChange(itemId, 1); // Add back to inventory
    } else {
      // Select cell to add item
      setSelectedCell({ row, col });
      setIsSheetOpen(true);
    }
  };

  const addItemToCell = (item: FarmItem) => {
    if (!selectedCell || item.available <= 0) return;
    
    setGrid(prev => prev.map(c => 
      c.row === selectedCell.row && c.col === selectedCell.col 
        ? { ...c, item: { ...item, id: item.id } } 
        : c
    ));
    onInventoryChange(item.id, -1); // Remove from inventory
    setIsSheetOpen(false);
    setSelectedCell(null);
  };

  const clearGrid = () => {
    setGrid(prev => prev.map(c => ({ ...c, item: null })));
  };

  const getBackgroundStyle = () => {
    if (isDaytime) {
      return "bg-gradient-to-b from-primary/5 to-accent/10";
    }
    return "bg-gradient-to-b from-[hsl(220_40%_20%)] to-[hsl(220_40%_10%)]";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold gradient-text">{zoneName}</h3>
        <Button variant="outline" size="sm" onClick={clearGrid}>
          <Trash2 className="h-4 w-4 mr-2" />
          Очистить
        </Button>
      </div>

      <Card className={`p-2 ${getBackgroundStyle()}`}>
        <div 
          className="grid gap-px w-full"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            aspectRatio: '1 / 1',
          }}
        >
          {grid.map((cell) => (
            <button
              key={`${cell.row}-${cell.col}`}
              onClick={() => handleCellClick(cell.row, cell.col)}
              className={`
                border border-border/30 rounded-sm
                hover:bg-accent/20 transition-colors
                flex items-center justify-center
                ${cell.item ? 'bg-card/50 hover:ring-1 hover:ring-destructive' : 'bg-card/20'}
                ${GRID_ROWS > 15 ? 'text-xs' : GRID_ROWS > 12 ? 'text-sm' : 'text-base'}
              `}
              style={{
                aspectRatio: '1 / 1',
              }}
            >
              {cell.item ? cell.item.emoji : ''}
            </button>
          ))}
        </div>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Выбрать предмет</SheetTitle>
            <SheetDescription>
              Предметы зоны "{zoneName}"
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {availableItems.length === 0 ? (
              <p className="col-span-2 text-center text-muted-foreground">
                Выполняйте задания, чтобы получить предметы
              </p>
            ) : (
              availableItems.map((item, index) => (
                <Card 
                  key={index}
                  className={`p-4 cursor-pointer hover:bg-accent transition-colors text-center relative ${
                    item.available <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => item.available > 0 && addItemToCell(item)}
                >
                  <span className="text-4xl block mb-2">{item.emoji}</span>
                  <p className="text-sm font-medium">{item.name}</p>
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {item.available}
                  </div>
                </Card>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FarmZoneGrid;
