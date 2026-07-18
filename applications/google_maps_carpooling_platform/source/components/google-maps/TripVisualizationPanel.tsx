import { Activity, Flag, Navigation } from "lucide-react";
import type { TripVisualizationState } from "../../types/google-maps/tripVisualization";

interface TripVisualizationPanelProps {
  tripVisualizationState: TripVisualizationState | null;
}

export function TripVisualizationPanel({
  tripVisualizationState,
}: TripVisualizationPanelProps) {
  if (!tripVisualizationState) {
    return null;
  }

  return (
    <section className="trip-visualization-panel" aria-label="Trip visualization">
      <div className="trip-visualization-panel__title">
        <Activity aria-hidden="true" size={18} />
        <span>Trip Progress</span>
      </div>

      <div
        aria-label={`${tripVisualizationState.progressPercentage}% trip progress`}
        className="trip-visualization-panel__progress"
      >
        <span
          style={{
            width: `${tripVisualizationState.progressPercentage}%`,
          }}
        />
      </div>

      <ol className="trip-visualization-panel__timeline">
        {tripVisualizationState.timelineSteps.map((timelineStep) => (
          <li
            className={`trip-visualization-panel__step trip-visualization-panel__step--${timelineStep.status}`}
            key={timelineStep.label}
          >
            {timelineStep.status === "upcoming" ? (
              <Flag aria-hidden="true" size={15} />
            ) : (
              <Navigation aria-hidden="true" size={15} />
            )}
            <span>{timelineStep.label}</span>
            <small>{timelineStep.description}</small>
          </li>
        ))}
      </ol>

      <p className="trip-visualization-panel__tracking">
        Tracking adapter: {tripVisualizationState.trackingAdapterStatus}
      </p>
    </section>
  );
}
