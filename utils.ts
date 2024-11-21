import { Task, TaskModel} from "./types.ts";
import { Collection, ObjectId} from "mongodb";
export const fromModelToTask = async (model: TaskModel): Promise<Task> => {
  return {
    id: model._id!.toString(),
    title: model.title,
    completed: model.completed,
  };
};

