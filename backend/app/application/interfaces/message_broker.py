"""
Message Broker Interface (Outbound Port)
"""
from abc import ABC, abstractmethod


class IMessageBroker(ABC):
    @abstractmethod
    def enqueue_scoring_task(self, submission_id: str, require_gpu: bool = False) -> None:
        """
        Push submission_id vào Message Queue để Worker consume.
        """
        pass
