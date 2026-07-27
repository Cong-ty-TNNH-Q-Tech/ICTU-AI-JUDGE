from abc import ABC, abstractmethod

class IMessageQueue(ABC):
    @abstractmethod
    def enqueue_scoring_task(self, submission_id: str) -> None:
        pass
