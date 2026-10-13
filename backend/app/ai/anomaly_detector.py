import os
import joblib
import numpy as np
from typing import Tuple, Optional
from sklearn.ensemble import IsolationForest

MODEL_FILE_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")

class IsolationForestDetector:
    def __init__(self, contamination: float = 0.05, n_estimators: int = 100, random_state: int = 42):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.model: Optional[IsolationForest] = None
        self._load_if_exists()

    def _load_if_exists(self) -> None:
        if os.path.exists(MODEL_FILE_PATH):
            try:
                self.model = joblib.load(MODEL_FILE_PATH)
            except Exception as e:
                print(f"[AI MODEL LOAD WARNING] Failed to load {MODEL_FILE_PATH}: {e}")
                self.model = None

    @property
    def is_trained(self) -> bool:
        return self.model is not None

    def fit(self, X: np.ndarray) -> int:
        """
        Trains IsolationForest on 2D feature matrix X and saves binary to disk.
        Returns sample count.
        """
        if X.shape[0] == 0:
            raise ValueError("Training matrix X cannot be empty.")

        # Ensure enough sample diversity if dataset size is small
        if X.shape[0] < 5:
            X = np.vstack([X] * int(np.ceil(5 / X.shape[0])))

        clf = IsolationForest(
            n_estimators=self.n_estimators,
            contamination=self.contamination,
            random_state=self.random_state
        )
        clf.fit(X)
        self.model = clf
        joblib.dump(clf, MODEL_FILE_PATH)
        return X.shape[0]

    def predict_one(self, feature_vector: list) -> Tuple[float, bool]:
        """
        Scores a single 1D feature vector using IsolationForest.
        Returns (anomaly_score, is_anomaly).
        
        IsolationForest decision_function:
        - Positive value (> 0.0) indicates NORMAL telemetry.
        - Negative value (< 0.0) indicates ANOMALOUS telemetry.
        
        Anomaly score calculation:
        - If decision_function >= 0: anomaly_score = 0.0 (Normal)
        - If decision_function < 0: anomaly_score = round(abs(decision_function), 4) (Anomalous)
        """
        if not self.is_trained or self.model is None:
            raise RuntimeError("Model is not trained yet.")

        X_single = np.array([feature_vector], dtype=np.float64)
        dec_func = float(self.model.decision_function(X_single)[0])
        pred = int(self.model.predict(X_single)[0])

        is_anomaly = (pred == -1) or (dec_func < 0.0)
        anomaly_score = 0.0 if dec_func >= 0 else round(abs(dec_func), 4)

        return anomaly_score, is_anomaly

# Global singleton detector instance
detector_instance = IsolationForestDetector()
