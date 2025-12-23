"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  className?: string;
}

export default function RadialOrbitalTimeline({
  timelineData,
  className = "",
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const viewMode = "orbital" as const;
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const centerOffset = { x: 0, y: 0 };
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-white bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400";
      case "in-progress":
        return "text-white bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-400";
      case "pending":
        return "text-white/70 bg-white/10 border-white/30";
      default:
        return "text-white/70 bg-white/10 border-white/30";
    }
  };

  return (
    <div
      className={`w-full h-[600px] flex flex-col items-center justify-center bg-transparent overflow-hidden ${className}`}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* Center Core - Synthos branded */}
          <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-cyan-400 animate-pulse flex items-center justify-center z-10">
            <div className="absolute w-20 h-20 rounded-full border border-cyan-400/30 animate-ping opacity-70"></div>
            <div
              className="absolute w-24 h-24 rounded-full border border-cyan-400/20 animate-ping opacity-50"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center">
              <span className="text-cyan-600 font-bold text-sm">S</span>
            </div>
          </div>

          {/* Orbit Ring */}
          <div className="absolute w-96 h-96 rounded-full border border-cyan-500/20"></div>
          <div className="absolute w-[420px] h-[420px] rounded-full border border-cyan-500/10"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => { nodeRefs.current[item.id] = el; }}
                className="absolute transition-all duration-700"
                style={{
                  ...nodeStyle,
                  left: '50%',
                  top: '50%',
                  marginLeft: '-20px',
                  marginTop: '-20px',
                }}
              >
                {/* Glow effect */}
                <div
                  className={`absolute rounded-full pointer-events-none ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0) 70%)`,
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `${20 - (item.energy * 0.5 + 40) / 2}px`,
                    top: `${20 - (item.energy * 0.5 + 40) / 2}px`,
                  }}
                ></div>

                {/* Clickable node button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleItem(item.id);
                  }}
                  className={`
                  relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer
                  ${
                    isExpanded
                      ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white"
                      : isRelated
                      ? "bg-cyan-500/50 text-white"
                      : "bg-white/[0.05] text-cyan-400"
                  }
                  border-2 
                  ${
                    isExpanded
                      ? "border-cyan-400 shadow-lg shadow-cyan-500/30"
                      : isRelated
                      ? "border-cyan-400 animate-pulse"
                      : "border-white/20"
                  }
                  transition-all duration-300 backdrop-blur-sm
                  ${isExpanded ? "scale-150" : "hover:scale-110"}
                  focus:outline-none focus:ring-2 focus:ring-cyan-400/50
                `}
                >
                  <Icon size={16} />
                </button>

                {/* Label */}
                <div
                  className={`
                  absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none
                  text-xs font-semibold tracking-wider
                  transition-all duration-300
                  ${isExpanded ? "text-white scale-110" : "text-white/70"}
                `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-20 left-1/2 -translate-x-1/2 w-72 bg-black/90 backdrop-blur-xl border-cyan-500/30 shadow-xl shadow-cyan-500/10 overflow-visible">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-gradient-to-b from-cyan-400 to-transparent"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-2 text-[10px] font-mono uppercase tracking-wider ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status === "completed"
                            ? "ACTIVE"
                            : item.status === "in-progress"
                            ? "PROCESSING"
                            : "READY"}
                        </Badge>
                        <span className="text-[10px] font-mono text-cyan-400/70">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-sm mt-2 text-white">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-white/70">
                      <p>{item.content}</p>

                      <div className="mt-4 pt-3 border-t border-cyan-500/20">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="flex items-center text-white/60">
                            <Zap size={10} className="mr-1 text-cyan-400" />
                            Efficiency
                          </span>
                          <span className="font-mono text-cyan-400">{item.energy}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-cyan-500/20">
                          <div className="flex items-center mb-2">
                            <Link size={10} className="text-cyan-400/70 mr-1" />
                            <h4 className="text-[10px] uppercase tracking-wider font-mono text-white/50">
                              Connected Features
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-6 px-2 py-0 text-[10px] rounded-md border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-white/80 hover:text-white transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={8}
                                    className="ml-1 text-cyan-400"
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
