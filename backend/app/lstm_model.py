import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import torch
import torch.nn as nn

logger = logging.getLogger(__name__)

# Set random seed for reproducibility
torch.manual_seed(42)
np.random.seed(42)

class StockLSTM(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int = 32, num_layers: int = 1, output_dim: int = 1, is_classifier: bool = False):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_dim)
        self.is_classifier = is_classifier

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch_size, seq_len, input_dim)
        out, _ = self.lstm(x)
        # Take the output of the last sequence step
        out = self.fc(out[:, -1, :])
        if self.is_classifier:
            out = torch.sigmoid(out)
        return out

def create_sequences(X: np.ndarray, y: np.ndarray, seq_len: int = 20):
    xs, ys = [], []
    for i in range(len(X) - seq_len):
        xs.append(X[i : i + seq_len])
        ys.append(y[i + seq_len])
    return np.array(xs), np.array(ys)

def train_and_predict_lstm(
    df_train_features: pd.DataFrame,
    y_train_raw: pd.Series,
    df_test_features: pd.DataFrame,
    feature_cols: list[str],
    seq_len: int = 20,
    is_classifier: bool = False,
    epochs: int = 10,
    lr: float = 0.005,
    batch_size: int = 16
) -> np.ndarray:
    """
    Fits standard scaler on train data, constructs sequences, trains an LSTM model on CPU,
    and returns predictions for the test features.
    """
    # Scale features using training data parameters
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(df_train_features[feature_cols])
    X_test_scaled = scaler.transform(df_test_features[feature_cols])

    # We need to construct sequences. To predict the very first item in the test set,
    # we need the sequence of length seq_len prior to it.
    # Therefore, we prepend the last (seq_len) rows of training data to the test data.
    X_combined = np.vstack([X_train_scaled[-seq_len:], X_test_scaled])
    
    # For training sequences:
    y_train_np = y_train_raw.to_numpy()
    X_train_seq, y_train_seq = create_sequences(X_train_scaled, y_train_np, seq_len)
    
    if len(X_train_seq) == 0:
        # Fallback if training size is too small for seq_len
        logger.warning("Train sequence set empty, reducing seq_len to 5")
        seq_len = 5
        X_train_seq, y_train_seq = create_sequences(X_train_scaled, y_train_np, seq_len)
        X_combined = np.vstack([X_train_scaled[-seq_len:], X_test_scaled])

    # For testing sequences, we align them such that the i-th test point uses the 20 days prior to it.
    X_test_seq = []
    for i in range(len(X_test_scaled)):
        X_test_seq.append(X_combined[i : i + seq_len])
    X_test_seq = np.array(X_test_seq)

    # Initialize model
    model = StockLSTM(
        input_dim=len(feature_cols),
        hidden_dim=32,
        num_layers=1,
        output_dim=1,
        is_classifier=is_classifier
    )
    
    # Train model
    criterion = nn.BCELoss() if is_classifier else nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    
    X_train_t = torch.tensor(X_train_seq, dtype=torch.float32)
    y_train_t = torch.tensor(y_train_seq, dtype=torch.float32).unsqueeze(1)
    
    dataset_size = len(X_train_t)
    model.train()
    
    for epoch in range(epochs):
        permutation = torch.randperm(dataset_size)
        for i in range(0, dataset_size, batch_size):
            indices = permutation[i : i + batch_size]
            batch_x, batch_y = X_train_t[indices], y_train_t[indices]
            
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            
    # Predict
    model.eval()
    with torch.no_grad():
        X_test_t = torch.tensor(X_test_seq, dtype=torch.float32)
        preds = model(X_test_t).numpy().flatten()
        
    # Clean up memory
    import gc
    del model
    del optimizer
    del X_train_t
    del y_train_t
    del X_test_t
    gc.collect()
    
    return preds
